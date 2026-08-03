package com.rgoose.note.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rgoose.note.entity.Image;
import org.apache.ibatis.annotations.Mapper;

/**
 * 媒体文件元数据 Mapper
 */
@Mapper
public interface ImageMapper extends BaseMapper<Image> {
}
