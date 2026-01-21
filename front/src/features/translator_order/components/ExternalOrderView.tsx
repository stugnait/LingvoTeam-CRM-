import type { ExternalOrder } from "../types"

interface Props {
    order: ExternalOrder
}

export function ExternalOrderView({ order }: Props) {
    return (
        <div className="max-w-3xl mx-auto mt-16 p-6">
            <h1 className="text-2xl font-semibold mb-6">
                Замовлення #{order.id}
            </h1>

            <div className="border rounded-lg p-4 space-y-4">
                <div>
                    <span className="text-gray-500 text-sm">Мовна пара</span>
                    <p className="font-medium">{order.language_pair}</p>
                </div>

                <div>
                    <span className="text-gray-500 text-sm">Дедлайн</span>
                    <p className="font-medium">
                        {new Date(order.deadline).toLocaleString()}
                    </p>
                </div>

                <div>
                    <span className="text-gray-500 text-sm">Коментар</span>
                    <p className="whitespace-pre-line">
                        {order.comment || "Коментар відсутній"}
                    </p>
                </div>
            </div>
        </div>
    )
}
