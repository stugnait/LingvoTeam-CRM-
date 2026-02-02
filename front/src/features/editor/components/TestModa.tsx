"use client"

import { useState } from "react"
import { Button } from "@/src/components/ui/button"
import { TaskModal } from "@/src/components/modals/jira/InfoModal"

export default function TestTaskModalPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // ЗАХАРДКОДЖЕНІ ДАНІ ДЛЯ ТЕСТУВАННЯ
    const testTask = {
        id: "LIN-59",
        title: "Додати функції скачування файла, оцінки, відхилення і тд для едітора",
        description: `Редактировать описание

### Подзадачи
Выполнено 50 %

| Задачи    | Пр... | Ис... | Статус |
|---|---|---|---|
| LIN-60    | = M   | /    | готово |
| LIN-61    | = M   | /    | к выполнению |

### Привязанные задачи
Добавить связанную задачу

### В работе
- Сведения
  - Исполнитель: Anton Olianiuk
  - Метки: Нет
  - Родитель: Нет
  - Срок исполнения: Нет
  - Team: Нет
  - Start date: Нет
  - Sprint: LIN Sprint 1
  - Автор: Anton Olianiuk`,
        status: "В роботі",
        priority: "high" as const,
        assignee: {
            name: "Антон Олійнюк",
            role: "Frontend Developer",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anton"
        },
        reporter: {
            name: "Менеджер Проектів",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Manager"
        },
        dueDate: "2024-12-31",
        labels: ["фронтенд", "важливо", "дедлайн", "UI/UX", "bug"],
        sprint: "LIN Sprint 1",
        team: "Frontend Team"
    }

    // ТЕСТОВІ ФУНКЦІЇ ДЛЯ ОБРОБКИ ПОДІЙ
    const handleSave = () => {
        console.log("✅ Завдання збережено:", testTask.id)
        setIsModalOpen(false)
    }

    const handleCancel = () => {
        console.log("❌ Операцію скасовано")
        setIsModalOpen(false)
    }

    const handleDelete = () => {
        console.log("🗑️ Завдання видалено:", testTask.id)
        setIsModalOpen(false)
    }

    const handleAssignToMe = () => {
        console.log("👤 Призначено на себе")
        // Тут можна оновити стан assignee
    }

    const simulateLoading = () => {
        setIsLoading(true)
        setTimeout(() => {
            setIsLoading(false)
            console.log("⏳ Завантаження завершено")
        }, 2000)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        🧪 Тестування TaskModal компонента
                    </h1>
                    <p className="text-gray-600">
                        Компонент модалки для перегляду та редагування задач, схожий на Jira
                    </p>
                </div>

                {/* КАРТКА З ІНФОРМАЦІЄЮ ПРО ТЕСТОВІ ДАНІ */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                        📋 Тестові дані (захардкоджені)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div>
                                <span className="font-medium text-gray-500">ID задачі:</span>
                                <span className="ml-2 font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                    {testTask.id}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-500">Назва:</span>
                                <p className="mt-1">{testTask.title}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-500">Статус:</span>
                                <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                                    {testTask.status}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-500">Пріоритет:</span>
                                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                                    testTask.priority === "high" ? "bg-orange-100 text-orange-800" :
                                        "bg-green-100 text-green-800"
                                }`}>
                                    {testTask.priority.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <span className="font-medium text-gray-500">Виконавець:</span>
                                <p className="mt-1">{testTask.assignee.name}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-500">Автор:</span>
                                <p className="mt-1">{testTask.reporter.name}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-500">Дедлайн:</span>
                                <p className="mt-1">{testTask.dueDate}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-500">Мітки:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {testTask.labels.map((label, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                        >
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* КНОПКИ ДЛЯ ТЕСТУВАННЯ */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                        🎮 Тестові дії
                    </h2>

                    <div className="flex flex-wrap gap-4">
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            📖 Відкрити модалку
                        </Button>

                        <Button
                            onClick={() => {
                                setIsModalOpen(true)
                                simulateLoading()
                            }}
                            variant="outline"
                        >
                            ⏳ Відкрити з завантаженням
                        </Button>

                        <Button
                            onClick={() => {
                                console.log("🔄 Оновлення даних")
                                // Можна оновити testTask тут
                            }}
                            variant="outline"
                        >
                            🔄 Оновити дані
                        </Button>

                        <Button
                            onClick={() => setIsModalOpen(false)}
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                            ❌ Закрити модалку
                        </Button>
                    </div>

                    <div className="mt-6">
                        <h3 className="font-medium text-gray-700 mb-2">
                            Стан завантаження: {isLoading ? "⏳ Завантажується..." : "✅ Готово"}
                        </h3>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${
                                    isLoading ? "w-full bg-blue-500" : "w-0"
                                }`}
                            />
                        </div>
                    </div>
                </div>

                {/* ІНСТРУКЦІЯ */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                        📝 Інструкція по використанню
                    </h3>
                    <ul className="space-y-2 text-yellow-700">
                        <li>• Натисніть Відкрити модалку для перегляду</li>
                        <li>• Перевірте роботу кнопок всередині модалки</li>
                        <li>• Спробуйте Відкрити з завантаженням для тесту стану loading</li>
                        <li>• Консоль браузера покаже всі дії</li>
                        <li>• Дані захардкоджені в змінній <code>testTask</code></li>
                    </ul>
                </div>

                {/* МОДАЛКА */}
                <TaskModal
                    // Обов'язкові пропси
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    taskId={testTask.id}
                    taskTitle={testTask.title}
                    taskDescription={testTask.description}
                    status={testTask.status}
                    priority={testTask.priority}

                    // Опціональні пропси
                    assignee={testTask.assignee}
                    reporter={testTask.reporter}
                    dueDate={testTask.dueDate}
                    labels={testTask.labels}
                    sprint={testTask.sprint}
                    team={testTask.team}

                    // Стан та функції
                    isLoading={isLoading}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onDelete={handleDelete}
                    onAssignToMe={handleAssignToMe}
                />
            </div>

            {/* ФУТЕР З ІНФО */}
            <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
                <p>Компонент TaskModal • Тестовий файл • Всі дані захардкоджені для тестування</p>
                <p className="mt-1">Подивіться консоль браузера для відстеження подій</p>
            </div>
        </div>
    )
}