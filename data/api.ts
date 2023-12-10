import {resetFields, Task, TaskStatus} from "./domain";

class UpdateTaskReq {
    field_masks: string[];
    task_data: Task;

    constructor(fieldMasks: string[], task: Task) {
        this.field_masks = fieldMasks;
        this.task_data = task;
    }

}

interface TaskRpcInterface {
    submitTask(task: Task): Promise<void>;
    holdTask(taskId: string): Promise<Task>;
    updateTask(taskId: string, req: UpdateTaskReq): Promise<void>;
}

class TaskRpcClient implements TaskRpcInterface {
    private readonly host: string;

    constructor(host: string) {
        this.host = host;
    }

    async submitTask(task: Task): Promise<void> {
        const url = `${this.host}/task/create`;
        await this._jsonPost(url, { task_data: task });
        return
    }

    async holdTask(taskId: string): Promise<Task> {
        const url = `${this.host}/task/hold/${taskId}`;
        const userData = await this._jsonPost(url);
        const taskData = userData.task_data;
        return new Task(
            taskData.task_type,
            taskData.context,
            taskData.user_id,
            taskData.task_id,
            taskData.version,
            taskData.max_retry_num,
            taskData.retry_interval,
            taskData.max_running_num,
            taskData.priority,
            taskData.stage_conf,
            taskData.stage,
            taskData.stage_progress,
            taskData.status,
            taskData.retry_index,
            taskData.log,
            taskData.order_time,
            taskData.create_time,
            taskData.modify_time,
        );
    }

    async resetTask(taskId: string): Promise<void> {
        await this.updateTask(taskId, new UpdateTaskReq(
            resetFields,
                  new Task("", "", "", taskId,
                0, 0, [], 0, 0,
                "", "", 0, TaskStatus.CREATED, 0, [],
                0, 0, new Date().getTime()
        )));
    }

    async updateTask(taskId: string, req: UpdateTaskReq): Promise<void> {
        const url = `${this.host}/task/update/${taskId}`;
        await this._jsonPost(url, req);
    }

    async getTasks(filter: {}, offset: number, limit: number): Promise<{tasks: Task[], count: number}> {
        const url = `${this.host}/task/list`;
        return await this._jsonPost(url, {
            filter: filter,
            offset: offset,
            limit: limit
        });
    }

    private async _jsonPost(url: string, data: any = {}): Promise<any> {
        let response;
        try {
            const headers = { 'Content-Type': 'application/json' };
            response = await fetch(url, {
                headers: headers,
                body: JSON.stringify(data),
                method: "POST"
            })
            return await this._handleResponse(response);
        } catch (error) {
            throw new Error(`RPC Request Client system error: ${error}`);
        }
    }

    private async _handleResponse(response: Response): Promise<any> {
        if (!response) return;
        if (response.status >= 300) {
            const trace = response.headers.get("context-trace-id")
            throw new Error(`RPC internal error: ${response.statusText}, trace: ${trace}`);
        }
        const json_data = await response.json()
        if (json_data.code === 0 || json_data.code === 200) {
            return json_data.data;
        }
        throw new Error(`RPC internal error: ${json_data.msg}`);
    }
}

export const Client = new TaskRpcClient("https://async-scheduler.bv5a7f4ddoqnm.ap-southeast-1.cs.amazonlightsail.com");