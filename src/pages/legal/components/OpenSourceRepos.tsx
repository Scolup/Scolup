const REPOS = [
  {
    href: "https://github.com/Scolup/Scolup",
    label: "github.com/Scolup/Scolup",
  },
  {
    href: "https://github.com/Scolup/Litedirecte",
    label: "github.com/Scolup/Litedirecte",
  },
  {
    href: "https://github.com/Scolup/Procsy",
    label: "github.com/Scolup/Procsy",
  },
] as const

export function OpenSourceRepos() {
  return (
    <ul>
      {REPOS.map((repo) => (
        <li key={repo.href}>
          <a href={repo.href} target="_blank" rel="noopener noreferrer">
            {repo.label}
          </a>
        </li>
      ))}
    </ul>
  )
}
