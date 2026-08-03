package com.rgoose.note.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.rgoose.note.common.BizException;
import com.rgoose.note.dto.NoteDetailVO;
import com.rgoose.note.entity.Block;
import com.rgoose.note.entity.Connection;
import com.rgoose.note.entity.Note;
import com.rgoose.note.mapper.BlockMapper;
import com.rgoose.note.mapper.ConnectionMapper;
import com.rgoose.note.mapper.NoteMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 笔记业务逻辑：条件查询、详情组装、深拷贝复制
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class NoteService {

    private final NoteMapper noteMapper;
    private final BlockMapper blockMapper;
    private final ConnectionMapper connectionMapper;

    /**
     * 条件查询笔记列表
     *
     * @param folderId 文件夹 id（非空时过滤）
     * @param keyword  标题关键词（非空时 title LIKE）
     * @param tagId    标签 id（非空时用 JSON_CONTAINS 过滤）
     */
    public List<Note> list(String folderId, String keyword, String tagId) {
        LambdaQueryWrapper<Note> wrapper = new LambdaQueryWrapper<>();
        if (folderId != null && !folderId.isEmpty()) {
            wrapper.eq(Note::getFolderId, folderId);
        }
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.like(Note::getTitle, keyword);
        }
        if (tagId != null && !tagId.isEmpty()) {
            wrapper.apply("JSON_CONTAINS(tags, JSON_QUOTE({0}))", tagId);
        }
        return noteMapper.selectList(wrapper);
    }

    /**
     * 查询笔记详情（含 blocks、connections）
     */
    public NoteDetailVO get(String id) {
        Note note = requireNote(id);
        NoteDetailVO vo = new NoteDetailVO();
        BeanUtils.copyProperties(note, vo);
        vo.setDeleted(note.getDeleted());
        vo.setBlocks(blockMapper.selectList(
                new LambdaQueryWrapper<Block>().eq(Block::getNoteId, id)));
        vo.setConnections(connectionMapper.selectList(
                new LambdaQueryWrapper<Connection>().eq(Connection::getNoteId, id)));
        return vo;
    }

    /**
     * 新建笔记
     */
    public Note create(Note note) {
        long now = System.currentTimeMillis();
        note.setCreatedAt(now);
        note.setUpdatedAt(now);
        noteMapper.insert(note);
        return note;
    }

    /**
     * 更新笔记
     */
    public Note update(String id, Note note) {
        requireNote(id);
        note.setId(id);
        note.setUpdatedAt(System.currentTimeMillis());
        noteMapper.updateById(note);
        return note;
    }

    /**
     * 软删除笔记 + 物理删除关联的 blocks 与 connections
     */
    @Transactional(rollbackFor = Exception.class)
    public void delete(String id) {
        noteMapper.deleteById(id);
        blockMapper.delete(new LambdaQueryWrapper<Block>().eq(Block::getNoteId, id));
        connectionMapper.delete(new LambdaQueryWrapper<Connection>().eq(Connection::getNoteId, id));
    }

    /**
     * 深拷贝笔记：复制笔记本体、blocks、connections，生成新 UUID，
     * 连线的 from/to 映射到新 block id
     */
    @Transactional(rollbackFor = Exception.class)
    public Note duplicate(String id) {
        Note source = requireNote(id);
        long now = System.currentTimeMillis();

        // 深拷贝笔记本体（避免修改 MyBatis 缓存中的原始对象）
        Note copy = new Note();
        BeanUtils.copyProperties(source, copy);
        copy.setId(UUID.randomUUID().toString());
        copy.setTitle(source.getTitle() + " (副本)");
        copy.setCreatedAt(now);
        copy.setUpdatedAt(now);
        noteMapper.insert(copy);

        // 复制 blocks，建立 oldId -> newId 映射
        List<Block> blocks = blockMapper.selectList(
                new LambdaQueryWrapper<Block>().eq(Block::getNoteId, id));
        Map<String, String> idMap = new HashMap<>();
        for (Block block : blocks) {
            String oldId = block.getId();
            String newId = UUID.randomUUID().toString();
            idMap.put(oldId, newId);
            block.setId(newId);
            block.setNoteId(source.getId());
            block.setCreatedAt(now);
            block.setUpdatedAt(now);
            blockMapper.insert(block);
        }

        // 复制 connections，映射 from/to 到新 block id
        List<Connection> conns = connectionMapper.selectList(
                new LambdaQueryWrapper<Connection>().eq(Connection::getNoteId, id));
        for (Connection conn : conns) {
            conn.setId(UUID.randomUUID().toString());
            conn.setNoteId(source.getId());
            conn.setFrom(idMap.getOrDefault(conn.getFrom(), conn.getFrom()));
            conn.setTo(idMap.getOrDefault(conn.getTo(), conn.getTo()));
            conn.setCreatedAt(now);
            connectionMapper.insert(conn);
        }

        return copy;
    }

    /**
     * 查询全部未删除笔记（用于同步）
     */
    public List<Note> listAll() {
        return noteMapper.selectList(null);
    }

    /**
     * 按 id 查询笔记实体，不存在抛异常
     */
    private Note requireNote(String id) {
        Note note = noteMapper.selectById(id);
        if (note == null) {
            throw BizException.notFound("笔记不存在");
        }
        return note;
    }
}
