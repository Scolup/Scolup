import { describe, expect, test } from "bun:test"
import {
  escapeHtml,
  SCOLUP_LOGO_DATA_URI,
  withScolupSignature,
} from "../src/pages/messages/helpers"

describe("escapeHtml", () => {
  test("échappe les caractères spéciaux", () => {
    expect(escapeHtml(`<b>"&"'</b>`)).toBe(
      "&lt;b&gt;&quot;&amp;&quot;&#39;&lt;/b&gt;"
    )
  })
})

describe("withScolupSignature", () => {
  test("ajoute le texte en italique et le logo embarqué", () => {
    const html = withScolupSignature("Bonjour")
    expect(html).toContain("Bonjour")
    expect(html).toContain('<i style="font-size:12px;')
    expect(html).toContain("Envoyé avec Scolup")
    expect(html).toContain(`<img src="${SCOLUP_LOGO_DATA_URI}"`)
    expect(html).toContain('width="12" height="12"')
    expect(SCOLUP_LOGO_DATA_URI.startsWith("data:image/png;base64,")).toBe(true)
  })

  test("convertit les sauts de ligne en <br> et échappe le HTML tapé", () => {
    const html = withScolupSignature("Salut\n<script>alert(1)</script>")
    expect(html).toContain("Salut<br>&lt;script&gt;")
    expect(html).not.toContain("<script>alert")
  })

  test("accents transmis tels quels (Lowdirecte les encode à l'envoi)", () => {
    const html = withScolupSignature("à moi et Paul, café")
    expect(html).toContain("à moi et Paul, café")
  })

  test("contenu vide : rien ajouté", () => {
    expect(withScolupSignature("   ")).toBe("")
  })
})
