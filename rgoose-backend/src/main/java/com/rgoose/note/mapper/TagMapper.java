package com.rgoose.note.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rgoose.note.entity.Tag;
import org.apache.ibatis.annotations.Mapper;

/**
 * 标签 Mapper
 */
@Mapper
public interface TagMapper extends BaseMapper<Tag> {
}
