package com.dollshare.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dollshare.common.BusinessException;
import com.dollshare.common.UserContext;
import com.dollshare.entity.AiMessage;
import com.dollshare.entity.Cabinet;
import com.dollshare.entity.Doll;
import com.dollshare.mapper.AiMessageMapper;
import com.dollshare.mapper.CabinetMapper;
import com.dollshare.mapper.DollMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * AI 助手（简化版 RAG）：
 * 1. 先检索当前用户可见的平台数据（自己的娃娃/柜子 + 平台公开娃娃）
 * 2. 把检索结果拼进提示词，调用豆包大模型生成回答
 * 隐私红线：只检索当前用户自己可见的数据；私密柜里的娃娃不会出现在"平台公开娃娃"里
 */
@Service
@RequiredArgsConstructor
public class AiService {

    private static final String URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";

    private final DollMapper dollMapper;
    private final CabinetMapper cabinetMapper;
    private final AiMessageMapper aiMessageMapper;
    private final ObjectMapper objectMapper;

    @Value("${doubao.api-key}")
    private String apiKey;

    @Value("${doubao.model}")
    private String model;

    /**
     * 提问入口：存提问 → 检索 → 调豆包 → 存回答
     */
    public String ask(String question) {
        Long me = UserContext.getUserId();
        // 记录提问
        saveMsg(me, "user", question);

        String context = buildContext();
        String system = "你是\"娃柜日记\"平台的 AI 助手，用户会问自己娃娃柜和平台公开娃娃的问题。" +
                "下面是刚从平台数据库检索出的真实数据：\n" + context +
                "\n回答规则：\n" +
                "1. 只基于上述数据回答；数据里没有的信息，就说\"平台里没找到相关信息\"，不要编造。\n" +
                "2. 问\"我的/我\"时只看【我的娃娃】【我的柜子】；问平台/大家/别人时看【平台公开娃娃】。\n" +
                "3. 涉及数量、价格、时间要以上述数据为准，不确定就说明。\n" +
                "4. 用中文回答，简洁友好（娃圈语气可以可爱），不要超过 150 字。";

        String content = chat(system, question);
        if (content == null || content.isBlank()) {
            throw new BusinessException("AI 助手暂时开小差了，稍后再试～");
        }
        // 记录回答
        saveMsg(me, "assistant", content.trim());
        return content.trim();
    }

    /**
     * 查询当前用户最近 50 条聊天记录（按时间倒序，最新在前）
     */
    public java.util.List<AiMessage> history() {
        return aiMessageMapper.selectList(
                new LambdaQueryWrapper<AiMessage>()
                        .eq(AiMessage::getUserId, UserContext.getUserId())
                        .orderByDesc(AiMessage::getId)
                        .last("LIMIT 50"));
    }

    private void saveMsg(Long userId, String role, String content) {
        AiMessage m = new AiMessage();
        m.setUserId(userId);
        m.setRole(role);
        m.setContent(content);
        aiMessageMapper.insert(m);
    }

    /**
     * 检索并拼装上下文文本
     */
    private String buildContext() {
        Long me = UserContext.getUserId();
        StringBuilder sb = new StringBuilder();

        // ===== 我的娃娃（本人可见全集，含私密——因为是自己问自己）=====
        List<Doll> myDolls = dollMapper.selectList(
                new LambdaQueryWrapper<Doll>()
                        .eq(Doll::getUserId, me)
                        .orderByDesc(Doll::getCreatedAt)
                        .last("LIMIT 100"));
        // ===== 我的柜子（名字 → id）=====
        List<Cabinet> myCabs = cabinetMapper.selectList(
                new LambdaQueryWrapper<Cabinet>().eq(Cabinet::getUserId, me));
        Map<Long, String> cabName = new HashMap<>();
        for (Cabinet c : myCabs) {
            cabName.put(c.getId(), c.getName());
        }
        // 柜子统计
        Map<Long, long[]> cabStat = new HashMap<>();
        for (Doll d : myDolls) {
            if (d.getCabinetId() == null) continue;
            long[] arr = cabStat.computeIfAbsent(d.getCabinetId(), k -> new long[2]);
            arr[0]++;
            if (d.getPrice() != null) {
                arr[1] += d.getPrice().movePointRight(2).longValue();
            }
        }

        sb.append("【我的娃娃】（共 ").append(myDolls.size()).append(" 只）\n");
        if (myDolls.isEmpty()) {
            sb.append("（暂无）\n");
        }
        for (Doll d : myDolls) {
            sb.append("- ").append(d.getName() == null ? "未命名" : d.getName())
                    .append(" | 种类：").append(d.getType() == null ? "未分类" : d.getType())
                    .append(" | 价格：").append(d.getPrice() == null ? "未填写" : d.getPrice() + "元")
                    .append(" | 渠道：").append(d.getBuyChannel() == null ? "未填写" : d.getBuyChannel())
                    .append(" | 柜子：").append(d.getCabinetId() != null ? cabName.getOrDefault(d.getCabinetId(), "其他") : "未分组")
                    .append(" | 添加时间：").append(d.getCreatedAt() == null ? "未知" : d.getCreatedAt().toLocalDate())
                    .append("\n");
        }

        sb.append("【我的柜子】（共 ").append(myCabs.size()).append(" 个）\n");
        if (myCabs.isEmpty()) {
            sb.append("（暂无）\n");
        }
        for (Cabinet c : myCabs) {
            long[] arr = cabStat.getOrDefault(c.getId(), new long[2]);
            sb.append("- 柜子：").append(c.getName())
                    .append(" | 娃娃数：").append(arr[0])
                    .append(" | 总金额：").append(String.format("%.2f", arr[1] / 100.0)).append("元")
                    .append("\n");
        }

        // ===== 平台公开娃娃（别人的，公开可见；排除私密柜）=====
        List<Doll> publicDolls = dollMapper.selectList(
                new LambdaQueryWrapper<Doll>()
                        .eq(Doll::getVisible, 0)
                        .ne(Doll::getUserId, me)
                        .orderByDesc(Doll::getCreatedAt)
                        .last("LIMIT 50"));
        // 排除私密柜里的娃娃（整柜私密 = 不可见）
        List<Cabinet> allPrivate = cabinetMapper.selectList(
                new LambdaQueryWrapper<Cabinet>().eq(Cabinet::getVisible, 1));
        Set<Long> privateCabIds = new HashSet<>();
        for (Cabinet c : allPrivate) {
            privateCabIds.add(c.getId());
        }
        List<Doll> visiblePublic = new ArrayList<>();
        for (Doll d : publicDolls) {
            if (d.getCabinetId() != null && privateCabIds.contains(d.getCabinetId())) {
                continue;
            }
            visiblePublic.add(d);
        }

        sb.append("【平台公开娃娃】（别人的公开娃娃，最近 ").append(visiblePublic.size()).append(" 只）\n");
        if (visiblePublic.isEmpty()) {
            sb.append("（暂无）\n");
        }
        for (Doll d : visiblePublic) {
            sb.append("- 主人：用户").append(d.getUserId())
                    .append(" | 名字：").append(d.getName() == null ? "未命名" : d.getName())
                    .append(" | 种类：").append(d.getType() == null ? "未分类" : d.getType())
                    .append(" | 价格：").append(d.getPrice() == null ? "未填写" : d.getPrice() + "元")
                    .append(" | 添加时间：").append(d.getCreatedAt() == null ? "未知" : d.getCreatedAt().toLocalDate())
                    .append("\n");
        }

        return sb.toString();
    }

    /**
     * 调用豆包大模型（OpenAI 兼容接口）
     */
    private String chat(String system, String user) {
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", model);
            ArrayNode messages = body.putArray("messages");
            messages.addObject().put("role", "system").put("content", system);
            messages.addObject().put("role", "user").put("content", user);
            body.put("temperature", 0.5);
            // 简单问答不需要深度思考：关闭后响应快 3~4 倍
            body.putObject("thinking").put("type", "disabled");

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(URL))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                    .build();

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(5))
                    .build();

            HttpResponse<String> resp = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                throw new BusinessException("AI 服务调用失败（HTTP " + resp.statusCode() + "），请检查 API Key 或模型配置");
            }
            JsonNode json = objectMapper.readTree(resp.body());
            return json.path("choices").get(0).path("message").path("content").asText("");
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("AI 助手暂时开小差了，稍后再试～");
        }
    }
}
