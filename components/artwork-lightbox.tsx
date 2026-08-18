"use client";

import Image from "next/image";
import { Maximize2, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

type ArtworkLightboxProps = {
  src: string;
  alt: string;
  caption?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function ArtworkLightbox({
  src,
  alt,
  caption,
  sizes,
  priority = false,
  className = "",
  style,
}: ArtworkLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [isOpen]);

  function openLightbox() {
    setIsOpen(true);
  }

  function closeLightbox() {
    dialogRef.current?.close();
  }

  const label = caption ?? alt;

  return (
    <>
      <button
        type="button"
        className={`artwork-trigger ${className}`.trim()}
        style={style}
        onClick={openLightbox}
        aria-haspopup="dialog"
        aria-label={`Vergroot afbeelding: ${label}`}
      >
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} />
        <span className="artwork-zoom" aria-hidden="true">
          <Maximize2 size={14} strokeWidth={1.5} />
          <span>Vergroot</span>
        </span>
      </button>

      <dialog
        ref={dialogRef}
        className="art-lightbox"
        onClose={() => setIsOpen(false)}
        aria-label={`Vergrote weergave van ${label}`}
      >
        <div className="art-lightbox-shell">
          <div className="art-lightbox-head">
            <p>{caption ?? "Werk van Carolien Ballast"}</p>
            <button type="button" onClick={closeLightbox} aria-label="Vergrote afbeelding sluiten">
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>
          <div className="art-lightbox-image">
            {isOpen ? <Image src={src} alt={alt} fill sizes="96vw" loading="eager" /> : null}
          </div>
          <p className="art-lightbox-hint">Gebruik Esc of de sluitknop om terug te gaan</p>
        </div>
      </dialog>
    </>
  );
}
