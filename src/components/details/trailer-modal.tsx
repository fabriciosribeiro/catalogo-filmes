'use client';

import { useRef, useState } from 'react';

type Props = { trailerKey: string; title: string };

export function TrailerModal({ trailerKey, title }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const openModal = () => {
    setOpen(true);
    dialogRef.current?.showModal(); // modal nativo: prende o foco e fecha com Esc
  };
  const closeModal = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        ▶ Ver trailer
      </button>
      <dialog
        ref={dialogRef}
        aria-label={`Trailer de ${title}`}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}
        className="m-auto w-[min(960px,92vw)] rounded-lg bg-black p-0 text-fg backdrop:bg-black/80"
      >
        <div className="flex justify-end p-2">
          <button
            type="button"
            onClick={closeModal}
            aria-label="Fechar trailer"
            className="px-2 text-sm text-muted hover:text-fg"
          >
            Fechar ✕
          </button>
        </div>
        {open && (
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1`}
              title={`Trailer de ${title}`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        )}
      </dialog>
    </>
  );
}
