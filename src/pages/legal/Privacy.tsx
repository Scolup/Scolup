import { LegalPage } from "./components/LegalPage"
import { HowItWorks } from "./components/HowItWorks"
import { OpenSourceRepos } from "./components/OpenSourceRepos"

export function Privacy() {
  return (
    <LegalPage doc="privacy" title="Politique de confidentialité">
      <h2>Principe général</h2>
      <p>
        Nous n'avons pas de base de données, ce qui veut dire que nous ne{" "}
        <em>pouvons</em> simplement pas enregistrer vos données. Chaque
        affirmation de cette page est vérifiable dans le code source public,
        listé en fin de document.
      </p>

      <HowItWorks />

      <h2>Identifiants et connexion</h2>
      <ul>
        <li>
          Votre identifiant et votre mot de passe EcoleDirecte servent
          uniquement à ouvrir la session, puis ne sont{" "}
          <strong>jamais enregistrés</strong>.
        </li>
        <li>
          Pour rester connecté, seul un jeton de session et un identifiant
          d'appareil sont conservés <strong>sur votre appareil</strong>. La
          double authentification éventuelle d'EcoleDirecte est traitée elle
          aussi sur votre appareil.
        </li>
      </ul>

      <h2>Ce qui est stocké sur votre appareil</h2>
      <ul>
        <li>
          <strong>Données de session EcoleDirecte</strong> (comptes, jeton,
          identifiant d'appareil) dans la base locale du navigateur.
        </li>
        <li>
          <strong>Préférences Scolup</strong> (thème, couleur, matières
          personnalisées) dans la base locale.
        </li>
      </ul>
      <p>
        Tout disparaît en vous déconnectant ou en effaçant les données du site
        dans votre navigateur. Rien n'est envoyé à Scolup.
      </p>

      <h2>Cookies, traceurs et vos droits</h2>
      <p>
        Pas de publicité, pas de traceurs tiers, pas de revente, et pas de
        cookie déposé par Scolup. Vos droits (accès, rectification, suppression)
        s'exercent en vous déconnectant ou en effaçant les données du site dans
        votre navigateur. Si vous avez moins de 15 ans, vos parents ou tuteurs
        peuvent exercer ces droits pour vous.
      </p>

      <h2>Transparence et code source</h2>
      <p>
        Scolup, Linkdirecte et Procsy sont open source sous licence AGPL-3.0 :
      </p>
      <OpenSourceRepos />
    </LegalPage>
  )
}
