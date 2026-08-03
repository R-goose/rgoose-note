package com.rgoose.note.controller;

import com.rgoose.note.common.R;
import com.rgoose.note.dto.NoteDetailVO;
import com.rgoose.note.entity.Note;
import com.rgoose.note.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 笔记 Controller
 */
@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    /** 笔记列表（支持 folderId / keyword / tagId 过滤） */
    @GetMapping
    public R<List<Note>> list(@RequestParam(required = false) String folderId,
                              @RequestParam(required = false) String keyword,
                              @RequestParam(required = false) String tagId) {
        return R.ok(noteService.list(folderId, keyword, tagId));
    }

    /** 笔记详情（含 blocks、connections、canvasConfig） */
    @GetMapping("/{id}")
    public R<NoteDetailVO> get(@PathVariable String id) {
        return R.ok(noteService.get(id));
    }

    /** 新建笔记 */
    @PostMapping
    public R<Note> create(@RequestBody Note note) {
        return R.ok(noteService.create(note));
    }

    /** 更新笔记 */
    @PutMapping("/{id}")
    public R<Note> update(@PathVariable String id, @RequestBody Note note) {
        return R.ok(noteService.update(id, note));
    }

    /** 软删除笔记 */
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id) {
        noteService.delete(id);
        return R.ok();
    }

    /** 复制笔记（深拷贝块与连线，生成新 ID） */
    @PostMapping("/{id}/duplicate")
    public R<Note> duplicate(@PathVariable String id) {
        return R.ok(noteService.duplicate(id));
    }

    /** 全部笔记列表（同步用） */
    @GetMapping("/all")
    public R<List<Note>> listAll() {
        return R.ok(noteService.listAll());
    }
}
