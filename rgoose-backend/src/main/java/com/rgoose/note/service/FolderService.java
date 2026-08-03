package com.rgoose.note.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.rgoose.note.common.BizException;
import com.rgoose.note.entity.Block;
import com.rgoose.note.entity.Connection;
import com.rgoose.note.entity.Folder;
import com.rgoose.note.entity.Note;
import com.rgoose.note.mapper.BlockMapper;
import com.rgoose.note.mapper.ConnectionMapper;
import com.rgoose.note.mapper.FolderMapper;
import com.rgoose.note.mapper.NoteMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 文件夹业务逻辑：支持层级查询与递归软删除
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class FolderService {

    private final FolderMapper folderMapper;
    private final NoteMapper noteMapper;
    private final BlockMapper blockMapper;
    private final ConnectionMapper connectionMapper;

    /**
     * 查询文件夹列表。parentId 为 null 查根级，否则查指定父级下
     */
    public List<Folder> list(String parentId) {
        LambdaQueryWrapper<Folder> wrapper = new LambdaQueryWrapper<>();
        if (parentId == null) {
            wrapper.isNull(Folder::getParentId);
        } else {
            wrapper.eq(Folder::getParentId, parentId);
        }
        return folderMapper.selectList(wrapper);
    }

    /**
     * 按 id 查询，不存在抛异常
     */
    public Folder get(String id) {
        Folder folder = folderMapper.selectById(id);
        if (folder == null) {
            throw BizException.notFound("文件夹不存在");
        }
        return folder;
    }

    /**
     * 新建文件夹
     */
    public Folder create(Folder folder) {
        long now = System.currentTimeMillis();
        folder.setCreatedAt(now);
        folder.setUpdatedAt(now);
        folderMapper.insert(folder);
        return folder;
    }

    /**
     * 更新文件夹
     */
    public Folder update(String id, Folder folder) {
        get(id);
        folder.setId(id);
        folder.setUpdatedAt(System.currentTimeMillis());
        folderMapper.updateById(folder);
        return folder;
    }

    /**
     * 递归软删除：软删此文件夹 → 递归软删子文件夹 → 软删其下笔记（及笔记的 blocks、connections）
     *
     * @return 受影响的资源总数
     */
    @Transactional(rollbackFor = Exception.class)
    public int delete(String id) {
        int count = 0;
        // 软删除当前文件夹
        count += folderMapper.deleteById(id);
        // 递归软删除子文件夹
        List<Folder> children = folderMapper.selectList(
                new LambdaQueryWrapper<Folder>().eq(Folder::getParentId, id));
        for (Folder child : children) {
            count += delete(child.getId());
        }
        // 软删除此文件夹下的笔记，并物理删除笔记的 blocks 与 connections
        List<Note> notes = noteMapper.selectList(
                new LambdaQueryWrapper<Note>().eq(Note::getFolderId, id));
        for (Note note : notes) {
            String noteId = note.getId();
            count += noteMapper.deleteById(noteId);
            count += blockMapper.delete(
                    new LambdaQueryWrapper<Block>().eq(Block::getNoteId, noteId));
            count += connectionMapper.delete(
                    new LambdaQueryWrapper<Connection>().eq(Connection::getNoteId, noteId));
        }
        return count;
    }

    /**
     * 查询全部未删除文件夹（用于同步）
     */
    public List<Folder> listAll() {
        return folderMapper.selectList(null);
    }
}
