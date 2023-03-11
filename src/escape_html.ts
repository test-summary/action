const lookup: Record<string, string> = {
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
    "<": "&lt;",
    ">": "&gt;"
}

export default function escapeHTML(s: string): string {
    return s.replace(/[&"'<>]/g, c => lookup[c])
}
