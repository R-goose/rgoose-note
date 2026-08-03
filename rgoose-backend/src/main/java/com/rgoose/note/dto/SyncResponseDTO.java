package com.rgoose.note.dto;

import com.rgoose.note.entity.Block;
import com.rgoose.note.entity.Connection;
import com.rgoose.note.entity.Folder;
import com.rgoose.note.entity.Note;
import com.rgoose.note.entity.Plan;
import com.rgoose.note.entity.Tag;
import lombok.Data;

import java.util.List;

/**
 * 同步拉取响应 DTO
 */
@Data
public class SyncResponseDTO {
    private Long serverTime;
    private List<Folder> folders;
    private List<Note> notes;
    private List<Plan> plans;
    private List<Tag> tags;
    private List<Block> blocks;           // 全部未删除的 block
    private List<Connection> connections; // 全部
}
