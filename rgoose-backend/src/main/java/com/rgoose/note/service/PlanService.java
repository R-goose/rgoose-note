package com.rgoose.note.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.rgoose.note.common.BizException;
import com.rgoose.note.entity.Plan;
import com.rgoose.note.mapper.PlanMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 计划/待办业务逻辑
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PlanService {

    private final PlanMapper planMapper;

    /**
     * 条件查询计划列表
     *
     * @param completed  完成状态过滤（非空时生效）
     * @param dueBefore  截止时间上限（非空时 dueDate <= dueBefore）
     * @param dueAfter   截止时间下限（非空时 dueDate >= dueAfter）
     */
    public List<Plan> list(Boolean completed, Long dueBefore, Long dueAfter) {
        LambdaQueryWrapper<Plan> wrapper = new LambdaQueryWrapper<>();
        if (completed != null) {
            wrapper.eq(Plan::getCompleted, completed);
        }
        if (dueBefore != null) {
            wrapper.le(Plan::getDueDate, dueBefore);
        }
        if (dueAfter != null) {
            wrapper.ge(Plan::getDueDate, dueAfter);
        }
        return planMapper.selectList(wrapper);
    }

    /**
     * 按 id 查询，不存在抛异常
     */
    public Plan get(String id) {
        Plan plan = planMapper.selectById(id);
        if (plan == null) {
            throw BizException.notFound("计划不存在");
        }
        return plan;
    }

    /**
     * 新建计划
     */
    public Plan create(Plan plan) {
        long now = System.currentTimeMillis();
        plan.setCreatedAt(now);
        plan.setUpdatedAt(now);
        planMapper.insert(plan);
        return plan;
    }

    /**
     * 更新计划
     */
    public Plan update(String id, Plan plan) {
        get(id);
        plan.setId(id);
        plan.setUpdatedAt(System.currentTimeMillis());
        planMapper.updateById(plan);
        return plan;
    }

    /**
     * 删除计划
     */
    public void delete(String id) {
        planMapper.deleteById(id);
    }

    /**
     * 切换完成状态
     */
    public void toggleComplete(String id) {
        Plan plan = get(id);
        plan.setCompleted(plan.getCompleted() == 1 ? 0 : 1);
        plan.setUpdatedAt(System.currentTimeMillis());
        planMapper.updateById(plan);
    }

    /**
     * 查询全部计划（用于同步）
     */
    public List<Plan> listAll() {
        return planMapper.selectList(null);
    }
}
