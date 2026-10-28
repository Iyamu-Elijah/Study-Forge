import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useToast } from '@/components/ui/use-toast';
import { deleteAllProfileData } from '@/services/profileService';

export default function DataPrivacyCard({ profile }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const removeEverything = async () => {
    setDeleting(true);
    try {
      await deleteAllProfileData(profile.id);
      navigate('/', { replace: true });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'We could not delete your data',
        description: error?.message || 'Please try again.',
      });
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="font-heading text-base">Data &amp; privacy</CardTitle>
          <p className="text-sm text-muted-foreground">
            How your study records are stored today.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              Your courses, tasks, notes, events and study sessions are stored in this app's
              database and linked to this student profile, which is remembered on this device only.
            </li>
            <li>
              This build runs without a sign-in wall, so records are not yet protected by a per-person
              account. Connecting a real identity provider is the one backend step left before release
              — it is isolated behind the app's data layer, so nothing in the interface has to change.
            </li>
            <li>No password is ever stored in your records, and no secret keys are used in the browser.</li>
          </ul>

          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Danger zone
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Deleting removes this profile and every course, task, note, event and study session
              attached to it. This cannot be undone.
            </p>
            <Button
              variant="destructive"
              className="mt-3"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Delete my data and profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete everything?"
        description="Your profile, courses, assignments, notes, events and study sessions will be permanently deleted."
        confirmLabel="Delete everything"
        pending={deleting}
        onConfirm={removeEverything}
      />
    </>
  );
}