package com.dollshare.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dollshare.entity.OpLog;
import org.apache.ibatis.annotations.Mapper;

/**
 * 管理员操作日志 Mapper
 */
@Mapper
public interface OpLogMapper extends BaseMapper<OpLog> {
}
