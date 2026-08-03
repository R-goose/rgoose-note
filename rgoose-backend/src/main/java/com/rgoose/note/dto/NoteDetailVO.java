package com.rgoose.note.dto;

import com.rgoose.note.entity.*;
import lombok.Data;

import java.util.List;

/**
 * 笔记详情视图对象（含 blocks 与 connections 子资源）
 */
@Data
public class NoteDetailVO {

    private String id;
    private String title;
    private String folderId;
    private List<String> tags;
    private CanvasConfig canvasConfig;
    private List<Block> blocks;
    private List<Connection> connections;
    private Long createdAt;
    private Long updatedAt;
    private Boolean deleted;
}
