package com.rgoose.note.dto;

import com.rgoose.note.entity.Folder;
import com.rgoose.note.entity.Note;
import com.rgoose.note.entity.Plan;
import com.rgoose.note.entity.Tag;
import lombok.Data;

import java.util.List;

/**
 * 数据导入请求 DTO
 */
@Data
public class ImportDataDTO {
    private List<Folder> folders;
    private List<Note> notes;
    private List<Plan> plans;
    private List<Tag> tags;
    private Long updatedAt;
}
