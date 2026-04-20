export default function SupportPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 pt-[90px] pb-16">
      <span className="kicker">Service client</span>
      <h1 className="mt-2 font-display text-[clamp(32px,5vw,48px)] -tracking-[0.03em]">Support</h1>
      <p className="mt-2 text-muted">
        Notre équipe est disponible du lundi au samedi, de 9h à 18h.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-serif text-lg">WhatsApp & téléphone</h3>
          <p className="mt-2 text-sm">+225 00 00 00 00</p>
        </div>
        <div className="card p-5">
          <h3 className="font-serif text-lg">Email</h3>
          <p className="mt-2 text-sm">support@kairos.example</p>
        </div>
      </div>
      <div className="card mt-6 p-5">
        <h3 className="font-serif text-lg">Questions fréquentes</h3>
        <ul className="mt-3 space-y-3 text-sm">
          <li>
            <strong>Livraison :</strong> 24 à 72h selon votre zone.
          </li>
          <li>
            <strong>Paiement :</strong> à la livraison, Mobile Money ou virement.
          </li>
          <li>
            <strong>Retour :</strong> sous 7 jours, produit non ouvert.
          </li>
        </ul>
      </div>
    </section>
  );
}
