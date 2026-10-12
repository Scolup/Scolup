// Shared chapter. The three legal documents all have to explain the same
// architecture, and they used to each say it slightly differently, so the
// wording lives here once and is rendered wherever a reader needs it.
export function HowItWorks() {
  return (
    <>
      <h2>Comment vos données vous parviennent</h2>
      <p>
        Scolup n'est pas un portail scolaire : c'est une interface alternative
        au portail <strong>EcoleDirecte</strong>. Vos notes, devoirs, messages,
        absences et post-its restent sur les serveurs d'EcoleDirecte ; Scolup se
        contente de les afficher.
      </p>
      <p>
        Lire un message dans l'application EcoleDirecte se fait en une étape.
        Depuis Scolup, il y en a deux, et ce n'est pas un choix. Les navigateurs
        appliquent les règles <strong>CORS</strong> : une page d'un domaine ne
        peut pas appeler un serveur qui n'accepte que son propre domaine, or les
        serveurs d'EcoleDirecte n'acceptent que{" "}
        <strong>ecoledirecte.com</strong>. De plus, un bug de longue date de
        Chromium qui empêche une application de définir son propre{" "}
        <strong>user-agent</strong>, alors qu'EcoleDirecte en exige un
        précisément.
      </p>
      <p>
        La solution aurait pu être une extension de navigateur, plus sûre mais
        payante et indisponible sur certaines plateformes. Nous avons écrit{" "}
        <strong>Procsy</strong>, un petit relais exécuté chez Cloudflare
        Workers, dont le code source est public sous licence AGPL-3.0. Chaque
        appel suit donc ce trajet :
      </p>
      <p>
        Scolup → <strong>Procsy</strong> (proxy.api.scolup.com) →{" "}
        <strong>EcoleDirecte</strong> (api.ecoledirecte.com) → retour par le
        même chemin.
      </p>

      <h3>Ce que Procsy fait de vos requêtes</h3>
      <ul>
        <li>Rien n'est enregistré, tout est supprimé dès la fin de l'appel.</li>
        <li>
          Comme tout relais HTTPS, le TLS s'arrête au Worker : votre requête
          traverse donc brièvement en clair, <strong>en mémoire</strong>, dans
          un bac à sable d'exécution isolé, comme n'importe quel CDN. Rien n'est
          écrit sur disque.
        </li>
      </ul>

      <h3>Ce que ce relais coûte</h3>
      <ul>
        <li>
          Un léger surcoût de latence, dû à l'étape supplémentaire, et
          négligeable en pratique.
        </li>
        <li>
          Un moyen de plus pour les hackers. Un second service, même sans état
          et open source, reste un élément qui pourrait en théorie être
          compromis : ce risque est très faible mais jamais nul.
        </li>
      </ul>
      <p>
        Notre avis est donc que Scolup est{" "}
        <strong>aussi sûr qu'EcoleDirecte lui-même</strong>. Le code étant
        public, vous pouvez le vérifier plutôt que nous croire.
      </p>
    </>
  )
}
