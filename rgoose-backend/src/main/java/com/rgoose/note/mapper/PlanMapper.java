package com.rgoose.note.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rgoose.note.entity.Plan;
import org.apache.ibatis.annotations.Mapper;

/**
 * 计划/待办 Mapper
 */
@Mapper
public interface PlanMapper extends BaseMapper<Plan> {
}
