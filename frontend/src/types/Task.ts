export interface Task {
    id: string;
    description: string;
    dueDate: string | null;
    isCompleted: boolean;
}
