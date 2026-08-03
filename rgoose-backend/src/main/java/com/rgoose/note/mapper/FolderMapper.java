package com.rgoose.note.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rgoose.note.entity.Folder;
import org.apache.ibatis.annotations.Mapper;

/**
 * 文件夹 Mapper
 */
@Mapper
public interface FolderMapper extends BaseMapper<Folder> {
}
