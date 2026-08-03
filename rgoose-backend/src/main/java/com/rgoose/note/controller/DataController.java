package com.rgoose.note.controller;

import com.rgoose.note.common.R;
import com.rgoose.note.dto.ImportDataDTO;
import com.rgoose.note.dto.SyncResponseDTO;
import com.rgoose.note.service.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 数据导入导出与同步 Controller
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DataController {

    private final SyncService syncService;

    /** 增量同步拉取（since=0 或不传表示全量） */
    @GetMapping("/sync")
    public R<SyncResponseDTO> sync(@RequestParam(required = false, defaultValue = "0") Long since) {
        return R.ok(syncService.pull(since));
    }

    /** 全量导出 */
    @GetMapping("/data/export")
    public R<SyncResponseDTO> exportData() {
        return R.ok(syncService.pull(0L));
    }

    /** 数据导入（按 updatedAt LWW 合并） */
    @PostMapping("/data/import")
    public R<Void> importData(@RequestBody ImportDataDTO data) {
        syncService.importData(data);
        return R.ok();
    }

    /** 清空全部业务数据 */
    @DeleteMapping("/data/all")
    public R<Void> clearAll() {
        syncService.clearAll();
        return R.ok();
    }
}
