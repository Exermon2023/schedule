"use client";
import React, {useEffect, useState, ChangeEvent} from "react";
import {statusPlayMap, Task, TaskStatus} from "@/data/domain";
import {Client} from "@/data/api";
import {
    Table,
    Modal,
    Button,
    Popover,
    Typography,
    Popconfirm,
    message,
    Row,
    Col,
    Input,
    Select,
    SelectProps,
    Spin
} from 'antd';

const {Link, Title} = Typography;

const columnsSetting = [{
    title: '租户',
    dataIndex: 'user_id',
    key: 'user_id',
    fixed: 'left',
    width: 100,
}, {
    title: '任务ID',
    dataIndex: 'task_id',
    key: 'task_id',
    fixed: 'left',
    width: 200,
}, {
    title: '任务名称',
    dataIndex: 'task_type',
    key: 'task_type',
    fixed: 'left',
    width: 100,
}, {
    title: '当前阶段',
    dataIndex: 'stage',
    key: 'stage',
    width: 100,
}, {
    title: '当前阶段进度',
    dataIndex: 'stage_progress',
    key: 'stage_progress',
    width: 120,
}, {
    title: '已重试次数',
    dataIndex: 'retry_index',
    key: 'retry_index',
    width: 120,
}, {
    title: '任务上下文',
    dataIndex: 'context',
    key: 'context',
    width: 120,
    align: 'center',
    render: (text, record) => (
        <Popover
            content={
                <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                    <code>{
                        JSON.stringify(JSON.parse(record.context), null, 2)
                    }</code>
                </pre>
            }
            trigger="hover">
            <Link>详情</Link>
        </Popover>
    )
}, {
    title: '任务状态',
    dataIndex: 'status_play',
    key: 'status_play',
    width: 120,
}, {
    title: '操作',
    dataIndex: '',
    key: 'action',
    fixed: 'right',
    responsive: ['md'],
    width: 100,
    render: (text, record) => (
        <Popconfirm
            title="重置任务"
            description="确认要重置任务吗?"
            onConfirm={() => {
                Client.resetTask(record.task_id).then(() => {
                    message.success("重置成功");
                    window.location.reload();
                })
            }}
            onCancel={() => {
                message.error('取消重置');
            }}
            okText="Yes"
            cancelText="No"
        >
            <Button danger>重置</Button>
        </Popconfirm>
    )
}, {
    title: '日志',
    dataIndex: 'log',
    fixed: 'right',
    key: 'log',
    render: (text, record) => (
        <Popover
            content={
                <div>
                    {record.log.map((item, index) => (
                        <p key={index} style={{margin: 0}}>{item}</p>
                    ))}
                </div>
            }
            trigger="hover">
            <Link>查看日志</Link>
        </Popover>
    )
}];

const style: React.CSSProperties = {
    background: '#0092ff',
    padding: '8px 0',
    borderRadius: '8px'
};

// 为第一个Row添加底部边距
const rowStyle: React.CSSProperties = {
    marginBottom: '20px', // 你可以根据需要调整这个值
};


const defaultPageSize = 4;
const calPageIndex = (offset: number) => {
    return Math.floor(offset / defaultPageSize) + 1;
}

const TaskTable: React.FC = ({}) => {
    const [tasks, setTasks] = useState([])
    const [querying, setQuerying] = useState(true)
    const [filter, setFilter] = useState({} as any) as any

    const [offset, setOffset] = useState(0);
    const [total, setTotal] = useState(0);

    const fetchTask = async () => {
        const resp = await Client.getTasks(filter, offset, defaultPageSize)
        if (!resp.tasks) {
            resp.tasks = []
        }
        setTasks(resp.tasks.map((task) => {
            task.status_play = statusPlayMap.get(task.status)
            return task
        }))
        setTotal(resp.count)
    }


    useEffect(() => {
        setQuerying(true)
        fetchTask().then(() => setQuerying(false))
    }, [offset])

    const statsOptions: SelectProps['options'] = Array.from(statusPlayMap.entries())
        .map(([key, value]) => ({
            label: value,
            value: key,
        }));

    const handleInputChange = (dataKey: string) => (e: ChangeEvent<HTMLInputElement>) => {
        e.target.value = e.target.value.trim()
        if (!e.target.value) {
            delete filter[dataKey]
            console.log("handleStatusSelect", filter)
            return
        }
        filter[dataKey] = e.target.value
        console.log("handleStatusSelect", filter)
    };
    const handleStatusSelect = (value: TaskStatus) => {
        if (!value) {
            delete filter['status']
            console.log("handleStatusSelect", filter)
            return
        }
        filter['status'] = value
        console.log("handleStatusSelect", filter)
    }
    const handleQuery = () => {
        // 去除空值
        for (const key in filter) {
            if (!filter[key]) delete filter[key]
        }
        setQuerying(true)
        setFilter(filter)
        setOffset(0)
        fetchTask().then(() => setQuerying(false))
    }

    const handleTableChange = (pageIdx: number) => {
        const newOffset = (pageIdx - 1) * defaultPageSize;
        setOffset(newOffset);
    };


    return (
        <div>
            <Row style={rowStyle} justify="space-between">
                <Col span={6}>
                    <div>
                        <Title level={5}>任务ID</Title>
                        <Input
                            allowClear
                            placeholder={"请输入任务ID"}
                            onChange={handleInputChange("task_id")}
                        />
                    </div>
                </Col>
                <Col span={6}>
                    <div>
                        <Title level={5}>任务类型</Title>
                        <Input
                            allowClear
                            placeholder={"请输入任务类型"}
                            onChange={handleInputChange("task_type")}
                        />
                    </div>
                </Col>
                <Col span={6}>
                    <Title level={5}>任务状态</Title>
                    <Select
                        style={{width: '100%'}}
                        allowClear
                        placeholder="请选择任务状态"
                        onChange={handleStatusSelect}
                        options={statsOptions}
                    />
                </Col>
                <Col>
                    <Title level={5}>操作</Title>
                    <Button type="primary"
                            onClick={handleQuery}>
                        查询
                    </Button>
                </Col>
            </Row>
            <Row style={rowStyle}>
                <Col>
                    <Table
                        // @ts-ignore
                        columns={columnsSetting}
                        dataSource={tasks}
                        pagination={{
                            current: calPageIndex(offset),
                            pageSize: defaultPageSize,
                            total: total,
                            showSizeChanger: false,
                            onChange: handleTableChange}}
                    />
                </Col>
            </Row>
            <Spin spinning={querying} fullscreen />
        </div>
    );
};

export default TaskTable;