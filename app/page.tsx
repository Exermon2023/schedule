import styles from './page.module.css'
import TaskTable from "@/components/TaskTable/TaskTable";


export default function Home() {
    return (
        <main className={styles.main}>
            <TaskTable/>
        </main>
    )
}
