import { Link } from "react-router"
import { LegalPage } from "./components/LegalPage"
import { HowItWorks } from "./components/HowItWorks"
import { OpenSourceRepos } from "./components/OpenSourceRepos"

export function Terms() {
  return (
    <LegalPage doc="terms" title="Conditions d'utilisation">
      <h2>Objet</h2>
      <p>
        Scolup est une interface alternative au portail scolaire{" "}
        <strong>EcoleDirecte</strong>. En vous connectant, vous acceptez ces
        conditions dans leur intégralité. Le détail du trajet de vos données est
        expliqué dans le chapitre suivant, commun à tous nos documents.
      </p>

      <HowItWorks />

      <h2>Compte et accès</h2>
      <ul>
        <li>
          L'utilisation de Scolup nécessite un compte EcoleDirecte valide,
          fourni par votre établissement.
        </li>
        <li>
          Vos identifiants EcoleDirecte sont personnels et confidentiels. Ils
          servent uniquement à ouvrir la session, et Scolup ne les enregistre{" "}
          <strong>jamais</strong>.
        </li>
        <li>
          Vous vous engagez à utiliser Scolup conformément aux conditions
          d'EcoleDirecte et à ne pas détourner le service (automatisation
          abusive, revente d'accès, atteinte aux systèmes).
        </li>
        <li>
          Si vous n'avez pas atteint la majorité numérique (15 ans), l'accord de
          vos parents ou tuteurs est requis.
        </li>
      </ul>

      <h2>Logiciel libre</h2>
      <p>
        Scolup, Linkdirecte (le kit logiciel qui dialogue avec EcoleDirecte) et
        Procsy (le relais technique) sont des logiciels libres distribués sous
        licence <strong>AGPL-3.0</strong> : vous pouvez lire, étudier et
        vérifier l'intégralité du code qui traite vos données.
      </p>
      <OpenSourceRepos />

      <h2>Disponibilité et responsabilités</h2>
      <ul>
        <li>
          Scolup est fourni <strong>en l'état</strong>, sans garantie de
          disponibilité permanente. Les pannes, maintenances et évolutions
          d'EcoleDirecte peuvent interrompre le service : Scolup dépend de leurs
          serveurs pour afficher vos données.
        </li>
        <li>
          Nous ne sommes pas responsables du contenu affiché (notes, devoirs,
          messages) : il provient d'EcoleDirecte et de votre établissement.
        </li>
        <li>
          En cas de faille de sécurité, écrivez à{" "}
          <a href="mailto:security@scolup.com">security@scolup.com</a> plutôt
          que de la rendre publique. Les correctifs s'appliquent à la dernière
          version : gardez l'application à jour.
        </li>
      </ul>

      <h2>Données personnelles et droit applicable</h2>
      <p>
        Le détail figure dans notre{" "}
        <Link to="/privacy">Politique de confidentialité</Link> : en résumé, vos
        données scolaires restent entre votre appareil et EcoleDirecte, et nos
        serveurs ne conservent aucune donnée liée à votre compte scolaire. Pour
        toute question : <a href="mailto:hi@scolup.com">hi@scolup.com</a> ·
        studio : <a href="mailto:studio@typeof.fr">studio@typeof.fr</a>.
      </p>
      <p>
        Ces conditions sont soumises au <strong>droit français</strong>. En cas
        de litige, une solution amiable sera recherchée avant toute action en
        justice.
      </p>
    </LegalPage>
  )
}
