package com.rgoose.note.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.rgoose.note.common.BizException;
import com.rgoose.note.entity.Folder;
import com.rgoose.note.entity.Note;
import com.rgoose.note.entity.Plan;
import com.rgoose.note.entity.Tag;
import com.rgoose.note.mapper.FolderMapper;
import com.rgoose.note.mapper.NoteMapper;
import com.rgoose.note.mapper.PlanMapper;
import com.rgoose.note.mapper.TagMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 标签业务逻辑：名称唯一校验、删除时清理各资源 tags JSON 列中的引用
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TagService {

    private final TagMapper tagMapper;
    private final NoteMapper noteMapper;
    private final FolderMapper folderMapper;
    private final PlanMapper planMapper;

    /**
     * 查询全部标签，按 sort 排序（sort 为 null 时回退 createdAt）
     */
    public List<Tag> list() {
        return tagMapper.selectList(new QueryWrapper<Tag>()
                .last("ORDER BY COALESCE(sort, createdAt)"));
    }

    /**
     * 按 id 查询标签
     */
    public Tag get(String id) {
        Tag tag = tagMapper.selectById(id);
        if (tag == null) {
            throw BizException.notFound("标签不存在");
        }
        return tag;
    }

    /**
     * 新建标签（名称唯一校验）
     */
    public Tag create(Tag tag) {
        checkNameUnique(tag.getName(), null);
        long now = System.currentTimeMillis();
        tag.setCreatedAt(now);
        tag.setUpdatedAt(now);
        tagMapper.insert(tag);
        return tag;
    }

    /**
     * 更新标签（名称唯一校验，排除自身）
     */
    public Tag update(String id, Tag tag) {
        get(id);
        checkNameUnique(tag.getName(), id);
        tag.setId(id);
        tag.setUpdatedAt(System.currentTimeMillis());
        tagMapper.updateById(tag);
        return tag;
    }

    /**
     * 删除标签，并从 notes/folders/plans 的 tags JSON 列中移除该 tagId
     */
    @Transactional(rollbackFor = Exception.class)
    public void delete(String id) {
        tagMapper.deleteById(id);
        removeFromNotes(id);
        removeFromFolders(id);
        removeFromPlans(id);
    }

    /**
     * 名称唯一校验。excludeId 非空时排除该 id（更新场景）
     */
    private void checkNameUnique(String name, String excludeId) {
        LambdaQueryWrapper<Tag> wrapper = new LambdaQueryWrapper<Tag>()
                .eq(Tag::getName, name);
        if (excludeId != null) {
            wrapper.ne(Tag::getId, excludeId);
        }
        if (tagMapper.selectCount(wrapper) > 0) {
            throw BizException.conflict("标签名已存在");
        }
    }

    /**
     * 从所有笔记的 tags 列中移除指定 tagId
     */
    private void removeFromNotes(String tagId) {
        List<Note> notes = noteMapper.selectList(new LambdaQueryWrapper<Note>()
                .apply("JSON_CONTAINS(tags, JSON_QUOTE({0}))", tagId));
        for (Note note : notes) {
            if (note.getTags() != null && note.getTags().remove(tagId)) {
                noteMapper.updateById(note);
            }
        }
    }

    /**
     * 从所有文件夹的 tags 列中移除指定 tagId
     */
    private void removeFromFolders(String tagId) {
        List<Folder> folders = folderMapper.selectList(new LambdaQueryWrapper<Folder>()
                .apply("JSON_CONTAINS(tags, JSON_QUOTE({0}))", tagId));
        for (Folder folder : folders) {
            if (folder.getTags() != null && folder.getTags().remove(tagId)) {
                folderMapper.updateById(folder);
            }
        }
    }

    /**
     * 从所有计划的 tags 列中移除指定 tagId
     */
    private void removeFromPlans(String tagId) {
        List<Plan> plans = planMapper.selectList(new LambdaQueryWrapper<Plan>()
                .apply("JSON_CONTAINS(tags, JSON_QUOTE({0}))", tagId));
        for (Plan plan : plans) {
            if (plan.getTags() != null && plan.getTags().remove(tagId)) {
                planMapper.updateById(plan);
            }
        }
    }
}
