export function ExpiredLink() {
    return (
        <div className="max-w-md mx-auto mt-24 p-6 border rounded-lg text-center">
            <h1 className="text-xl font-semibold mb-2">
                Посилання недійсне
            </h1>
            <p className="text-gray-600">
                Термін дії посилання закінчився або доступ закритий.
            </p>
        </div>
    )
}
