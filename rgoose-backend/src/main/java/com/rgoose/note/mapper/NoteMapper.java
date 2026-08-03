package com.rgoose.note.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rgoose.note.entity.Note;
import org.apache.ibatis.annotations.Mapper;

/**
 * 笔记 Mapper
 */
@Mapper
public interface NoteMapper extends BaseMapper<Note> {
}
