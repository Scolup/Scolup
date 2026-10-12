import { Link } from "react-router"
import { LegalPage } from "./components/LegalPage"
import { OpenSourceRepos } from "./components/OpenSourceRepos"

export function Mentions() {
  return (
    <LegalPage doc="mentions" title="Mentions légales">
      <h2>Éditeur du site</h2>
      <p>
        Le site <strong>Scolup</strong> est édité par le studio{" "}
        <strong>typeof</strong>, joignable à{" "}
        <a href="mailto:studio@typeof.fr">studio@typeof.fr</a> ou via{" "}
        <a href="mailto:hi@scolup.com">hi@scolup.com</a>.
      </p>
      <p>
        Directeur de publication : le studio typeof. Pour toute demande relative
        au site, écrivez à <a href="mailto:hi@scolup.com">hi@scolup.com</a>.
      </p>

      <h2>Hébergeur</h2>
      <p>
        Scolup est hébergé par <strong>Cloudflare, Inc.</strong>, 101 Townsend
        Street, San Francisco, CA 94107, États-Unis (
        <a
          href="https://www.cloudflare.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          cloudflare.com
        </a>
        ). Les requêtes que l'application transmet vers EcoleDirecte transitent
        par <strong>Procsy</strong>, un relais open source exécuté sur
        l'infrastructure de Cloudflare Workers ; son fonctionnement est détaillé
        dans nos <Link to="/security">pages de sécurité</Link>.
      </p>

      <h2>Hébergement de vos données</h2>
      <p>
        Scolup n'héberge aucune donnée d'élève : vos notes, devoirs, messages et
        absences restent uniquement sur les serveurs d'EcoleDirecte ainsi que
        votre appareil. Le détail figure dans notre{" "}
        <Link to="/privacy">politique de confidentialité</Link>.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Scolup, Linkdirecte et Procsy sont des logiciels libres distribués sous
        licence <strong>AGPL-3.0</strong>. Vous pouvez lire, modifier et
        redistribuer leur code, à condition de publier leurs modifications sous
        la même licence.
      </p>
      <OpenSourceRepos />
      <p>
        La marque et le logo Scolup, ainsi que les contenus rédactionnels de ce
        site, ne sont pas couverts par cette licence et restent la propriété du
        studio typeof. EcoleDirecte est un service tiers, marque de son
        détenteur : Scolup n'est ni affilié ni validé par son éditeur.
      </p>

      <h2>Signalement d'une faille</h2>
      <p>
        Si vous découvrez une faille de sécurité, signalez-la à{" "}
        <a href="mailto:security@scolup.com">security@scolup.com</a> plutôt que
        publiquement. La procédure complète est décrite dans nos{" "}
        <Link to="/security">pages de sécurité</Link>.
      </p>
    </LegalPage>
  )
}
