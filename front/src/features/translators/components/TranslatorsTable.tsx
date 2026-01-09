import type { Translator } from "../types"

interface Props {
    translators: Translator[]
    onEdit: (t: Translator) => void
    onDelete: (t: Translator) => void
    onDeactivate: (t: Translator) => void
}

export function TranslatorsTable({
                                     translators,
                                     onEdit,
                                     onDelete,
                                     onDeactivate,
                                 }: Props) {
    return (
        <table className="w-full border">
            <thead>
            <tr className="border-b">
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th />
            </tr>
            </thead>
            <tbody>
            {translators.map((t) => (
                <tr key={t.id} className="border-b">
                    <td>{t.full_name}</td>
                    <td>{t.email}</td>
                    <td>{t.phone}</td>
                    <td className="flex gap-2">
                        <button onClick={() => onEdit(t)}>Edit</button>
                        <button onClick={() => onDeactivate(t)}>Deactivate</button>
                        <button
                            onClick={() => onDelete(t)}
                            className="text-red-600"
                        >
                            Delete
                        </button>
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
    )
}
