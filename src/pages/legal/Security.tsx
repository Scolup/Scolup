import { LegalPage } from "./components/LegalPage"
import { HowItWorks } from "./components/HowItWorks"
import { OpenSourceRepos } from "./components/OpenSourceRepos"

export function Security() {
  return (
    <LegalPage doc="security" title="Sécurité">
      <h2>Signaler une faille</h2>
      <p>
        Si vous découvrez une faille de sécurité dans Scolup,{" "}
        <strong>n'ouvrez pas d'issue publique ni de pull request</strong>.
        Écrivez-nous plutôt à{" "}
        <a href="mailto:security@scolup.com">security@scolup.com</a> en
        précisant :
      </p>
      <ul>
        <li>la description de la faille ;</li>
        <li>les étapes pour la reproduire ;</li>
        <li>l'impact potentiel.</li>
      </ul>
      <p>
        Nous accusons réception de votre signalement sous{" "}
        <strong>48 heures</strong> et fournissons un correctif ou un plan de
        mitigation dès que possible. Nous créditons les personnes à l'origine
        d'un signalement si elles le souhaitent, et vous pouvez rester anonymes.
      </p>

      <h2>Versions prises en charge</h2>
      <p>
        Les correctifs de sécurité s'appliquent à la{" "}
        <strong>dernière version</strong> uniquement. Gardez donc Scolup à jour.
      </p>

      <h2>Périmètre</h2>
      <p>
        Scolup s'appuie sur d'autres projets de notre organisation, notamment{" "}
        <strong>Lowdirecte</strong> et <strong>Procsy</strong>. Une faille
        trouvée dans l'un d'eux doit être signalée à{" "}
        <a
          href="https://github.com/Scolup/Lowdirecte"
          target="_blank"
          rel="noopener noreferrer"
        >
          son dépôt
        </a>{" "}
        puis à{" "}
        <a
          href="https://github.com/Scolup/Procsy"
          target="_blank"
          rel="noopener noreferrer"
        >
          celui de Procsy
        </a>
        , qui possèdent leur propre politique de sécurité.
      </p>

      <HowItWorks />

      <h2>Vérifier plutôt que croire</h2>
      <p>
        Le code étant open source, vous n'êtes pas obligé de nous croire sur
        parole : vous pouvez lire le code source entier.
      </p>
      <OpenSourceRepos />
    </LegalPage>
  )
}
