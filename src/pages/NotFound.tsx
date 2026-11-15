import { Compass } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/primitives';

export function NotFound() {
  return (
    <div className="container-page py-20">
      <EmptyState
        icon={<Compass className="h-7 w-7" aria-hidden="true" />}
        title="Page not found"
        description="That link does not exist in RecycleVision AI. Try the scanner, your eco actions or the dashboard."
        action={<ButtonLink to="/">Back to home</ButtonLink>}
      />
    </div>
  );
}
