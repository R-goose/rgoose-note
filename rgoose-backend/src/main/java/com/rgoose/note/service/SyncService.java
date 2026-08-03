package com.rgoose.note.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.rgoose.note.dto.ImportDataDTO;
import com.rgoose.note.dto.SyncResponseDTO;
import com.rgoose.note.entity.Block;
import com.rgoose.note.entity.Connection;
import com.rgoose.note.entity.Folder;
import com.rgoose.note.entity.Note;
import com.rgoose.note.entity.Plan;
import com.rgoose.note.entity.Tag;
import com.rgoose.note.mapper.BlockMapper;
import com.rgoose.note.mapper.ConnectionMapper;
import com.rgoose.note.mapper.FolderMapper;
import com.rgoose.note.mapper.NoteMapper;
import com.rgoose.note.mapper.PlanMapper;
import com.rgoose.note.mapper.TagMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 数据同步与合并服务
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SyncService {

    private final FolderMapper folderMapper;
    private final NoteMapper noteMapper;
    private final BlockMapper blockMapper;
    private final ConnectionMapper connectionMapper;
    private final PlanMapper planMapper;
    private final TagMapper tagMapper;

    /**
     * 增量/全量拉取数据
     *
     * @param since 上次同步时间戳，null 或 0 表示全量拉取
     * @return 变更数据集合
     */
    public SyncResponseDTO pull(Long since) {
        SyncResponseDTO resp = new SyncResponseDTO();
        resp.setServerTime(System.currentTimeMillis());

        boolean incremental = since != null && since > 0;

        // folders —— 按 updatedAt 增量过滤
        LambdaQueryWrapper<Folder> folderQuery = new LambdaQueryWrapper<>();
        if (incremental) {
            folderQuery.gt(Folder::getUpdatedAt, since);
        }
        resp.setFolders(folderMapper.selectList(folderQuery));

        // notes —— deleted=0 过滤（@TableLogic 自动追加），按 updatedAt 增量过滤
        LambdaQueryWrapper<Note> noteQuery = new LambdaQueryWrapper<>();
        if (incremental) {
            noteQuery.gt(Note::getUpdatedAt, since);
        }
        List<Note> notes = noteMapper.selectList(noteQuery);
        resp.setNotes(notes);

        // plans —— 按 updatedAt 增量过滤
        LambdaQueryWrapper<Plan> planQuery = new LambdaQueryWrapper<>();
        if (incremental) {
            planQuery.gt(Plan::getUpdatedAt, since);
        }
        resp.setPlans(planMapper.selectList(planQuery));

        // tags —— 按 updatedAt 增量过滤
        LambdaQueryWrapper<Tag> tagQuery = new LambdaQueryWrapper<>();
        if (incremental) {
            tagQuery.gt(Tag::getUpdatedAt, since);
        }
        resp.setTags(tagMapper.selectList(tagQuery));

        // blocks / connections —— 子资源，无独立 since 过滤
        if (incremental) {
            // 增量：查变更笔记的 noteId，再查这些笔记下的 blocks / connections
            List<String> noteIds = notes.stream()
                    .map(Note::getId)
                    .collect(Collectors.toList());
            if (noteIds.isEmpty()) {
                resp.setBlocks(Collections.emptyList());
                resp.setConnections(Collections.emptyList());
            } else {
                resp.setBlocks(blockMapper.selectList(
                        new LambdaQueryWrapper<Block>().in(Block::getNoteId, noteIds)));
                resp.setConnections(connectionMapper.selectList(
                        new LambdaQueryWrapper<Connection>().in(Connection::getNoteId, noteIds)));
            }
        } else {
            // 全量：直接查全部
            resp.setBlocks(blockMapper.selectList(null));
            resp.setConnections(connectionMapper.selectList(null));
        }

        return resp;
    }

    /**
     * 导入数据，按 updatedAt LWW（Last-Write-Wins）策略合并
     * <p>
     * 遍历每个记录：不存在则 insert，存在则比较 updatedAt，传入值 >= 已有值才 updateById
     *
     * @param data 导入数据
     */
    @Transactional(rollbackFor = Exception.class)
    public void importData(ImportDataDTO data) {
        // folders
        if (data.getFolders() != null) {
            for (Folder incoming : data.getFolders()) {
                Folder existing = folderMapper.selectById(incoming.getId());
                if (existing == null) {
                    folderMapper.insert(incoming);
                } else if (incoming.getUpdatedAt() >= existing.getUpdatedAt()) {
                    folderMapper.updateById(incoming);
                }
            }
        }

        // notes
        if (data.getNotes() != null) {
            for (Note incoming : data.getNotes()) {
                Note existing = noteMapper.selectById(incoming.getId());
                if (existing == null) {
                    noteMapper.insert(incoming);
                } else if (incoming.getUpdatedAt() >= existing.getUpdatedAt()) {
                    noteMapper.updateById(incoming);
                }
            }
        }

        // plans
        if (data.getPlans() != null) {
            for (Plan incoming : data.getPlans()) {
                Plan existing = planMapper.selectById(incoming.getId());
                if (existing == null) {
                    planMapper.insert(incoming);
                } else if (incoming.getUpdatedAt() >= existing.getUpdatedAt()) {
                    planMapper.updateById(incoming);
                }
            }
        }

        // tags
        if (data.getTags() != null) {
            for (Tag incoming : data.getTags()) {
                Tag existing = tagMapper.selectById(incoming.getId());
                if (existing == null) {
                    tagMapper.insert(incoming);
                } else if (incoming.getUpdatedAt() >= existing.getUpdatedAt()) {
                    tagMapper.updateById(incoming);
                }
            }
        }

        log.info("数据导入完成: folders={}, notes={}, plans={}, tags={}",
                data.getFolders() != null ? data.getFolders().size() : 0,
                data.getNotes() != null ? data.getNotes().size() : 0,
                data.getPlans() != null ? data.getPlans().size() : 0,
                data.getTags() != null ? data.getTags().size() : 0);
    }

    /**
     * 清空全部业务数据（物理删除所有表数据）
     * 用于前端「清除缓存」功能
     */
    @Transactional(rollbackFor = Exception.class)
    public void clearAll() {
        connectionMapper.delete(null);
        blockMapper.delete(null);
        noteMapper.delete(null);
        planMapper.delete(null);
        tagMapper.delete(null);
        folderMapper.delete(null);
        log.info("全部业务数据已清空");
    }
}
