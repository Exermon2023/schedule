import { v4 as uuidv4 } from 'uuid';


export enum TaskStatus {
    CREATED = 1,
    WAIT_FOR_RETRY = 2,
    WAIT_FOR_NEXT_STAGE = 3,
    SCHEDULED = 8,
    RUNNING = 9,
    FAILED = 11,
    SUCCESS = 12,
}

export const statusPlayMap = new Map<TaskStatus, string>([
    [TaskStatus.CREATED, "新建待调度"],
    [TaskStatus.WAIT_FOR_RETRY, "等待重试"],
    [TaskStatus.WAIT_FOR_NEXT_STAGE, "等待下一阶段调度"],
    [TaskStatus.SCHEDULED, "进入调度队列"],
    [TaskStatus.RUNNING, "运行中"],
    [TaskStatus.FAILED, "失败"],
    [TaskStatus.SUCCESS, "成功"],
]);


export const stageProgressUpdateFields = ["StageProgress", "Context"];
export const statusUpdateFields = ["Log", "Status", "RetryIndex", "Context", "ModifyTime", "OrderTime"];
export const stageChangeFields = [...statusUpdateFields, "Stage", "StageProgress"];
export const resetFields = ["Status", "RetryIndex", "Log", "ModifyTime", "OrderTime"];

export class Task {
    task_type: string;
    context: string;
    user_id: string;
    task_id: string;
    version: number;
    max_retry_num: number;
    retry_interval: number[];
    max_running_num: number;
    priority: number;
    stage_conf: string;
    stage: string;
    stage_progress: number;
    status: TaskStatus;
    status_play: string | undefined;
    retry_index: number;
    log: string[];
    order_time: number;
    create_time: number;
    modify_time: number;

    constructor(taskType: string, context: string,
                userId: string = "default",
                taskId: string = uuidv4(),
                version: number = 0,
                maxRetryNum: number = 5,
                retryInterval: number[] = [100, 200, 300, 500, 1000],
                maxRunningNum: number = 10,
                priority: number = 0,
                stageConf: string = "",
                stage: string = "",
                stageProgress: number = 0,
                status: TaskStatus = TaskStatus.CREATED,
                retryIndex: number = 0,
                log: string[] = [],
                orderTime: number = Date.now(),
                createTime: number = Date.now(),
                modifyTime: number = Date.now()) {
        this.task_type = taskType;
        this.context = context;
        this.user_id = userId;
        this.task_id = taskId;
        this.version = version;
        this.max_retry_num = maxRetryNum;
        this.retry_interval = retryInterval;
        this.max_running_num = maxRunningNum;
        this.priority = priority;
        this.stage_conf = stageConf;
        this.stage = stage;
        this.stage_progress = stageProgress;
        this.status = status;
        this.retry_index = retryIndex;
        this.log = log;
        this.order_time = orderTime;
        this.create_time = createTime;
        this.modify_time = modifyTime;
    }

    onUpdate(): void {
        this.modify_time = Date.now();
        this.resetOrderTime();
    }

    private resetOrderTime(): void {
        if (this.status === TaskStatus.CREATED) {
            this.order_time = this.create_time - this.priority;
        } else if (this.status === TaskStatus.WAIT_FOR_NEXT_STAGE) {
            this.order_time = this.modify_time - this.priority;
        } else if (this.status === TaskStatus.WAIT_FOR_RETRY) {
            this.order_time = this.modify_time + this.retry_interval[this.retry_index];
        }
    }
}
