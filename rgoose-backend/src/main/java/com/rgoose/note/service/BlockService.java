package com.rgoose.note.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.rgoose.note.entity.Block;
import com.rgoose.note.entity.Connection;
import com.rgoose.note.mapper.BlockMapper;
import com.rgoose.note.mapper.ConnectionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 画布块业务逻辑
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class BlockService {

    private final BlockMapper blockMapper;
    private final ConnectionMapper connectionMapper;

    /**
     * 查询指定笔记的全部块
     */
    public List<Block> list(String noteId) {
        return blockMapper.selectList(
                new LambdaQueryWrapper<Block>().eq(Block::getNoteId, noteId));
    }

    /**
     * 新建块
     */
    public Block create(String noteId, Block block) {
        block.setNoteId(noteId);
        long now = System.currentTimeMillis();
        block.setCreatedAt(now);
        block.setUpdatedAt(now);
        blockMapper.insert(block);
        return block;
    }

    /**
     * 更新块
     */
    public Block update(String noteId, String blockId, Block block) {
        block.setId(blockId);
        block.setNoteId(noteId);
        block.setUpdatedAt(System.currentTimeMillis());
        blockMapper.updateById(block);
        return block;
    }

    /**
     * 删除块 + 删除关联连线（from 或 to 等于 blockId）
     */
    public void delete(String noteId, String blockId) {
        blockMapper.deleteById(blockId);
        connectionMapper.delete(new LambdaQueryWrapper<Connection>()
                .eq(Connection::getNoteId, noteId)
                .and(w -> w.eq(Connection::getFrom, blockId).or().eq(Connection::getTo, blockId)));
    }

    /**
     * 批量更新块（画布拖拽场景）
     */
    @Transactional(rollbackFor = Exception.class)
    public void batchUpdate(String noteId, List<Block> blocks) {
        long now = System.currentTimeMillis();
        for (Block block : blocks) {
            block.setNoteId(noteId);
            block.setUpdatedAt(now);
            blockMapper.updateById(block);
        }
    }
}
