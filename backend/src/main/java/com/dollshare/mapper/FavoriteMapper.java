package com.dollshare.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dollshare.entity.Favorite;
import org.apache.ibatis.annotations.Mapper;

/**
 * 点赞 Mapper
 */
@Mapper
public interface FavoriteMapper extends BaseMapper<Favorite> {
}
