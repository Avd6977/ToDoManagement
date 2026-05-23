export interface Task {
    id: string;
    title: string;
    description: string;
    dueDate: string | null;
    isCompleted: boolean;
    ownerId: string;
    assignedToId: string | null;
}
