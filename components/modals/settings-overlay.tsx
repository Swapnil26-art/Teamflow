'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';

import { useLayoutStore } from '@/store/layout-store';
import { useMediaQuery } from '@/hooks/use-media-query';

import SettingsPanel from '@/components/settings/settings-panel';

export default function SettingsOverlay() {
  const { showSettingsOverlay, toggleSettingsOverlay, setSettingsOverlay } =
    useLayoutStore();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <Dialog open={showSettingsOverlay} onOpenChange={toggleSettingsOverlay}>
        <DialogContent className="overflow-y-auto h-full max-h-[700px]">
          <SettingsPanel />
        </DialogContent>
      </Dialog>
    );
  }

  // Keep the store and drawer state in sync so swipe/outside-click closes work
  const onOpenChange = (open: boolean) => {
    setSettingsOverlay(open);
  };

  return (
    <Drawer open={showSettingsOverlay} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="max-h-screen overflow-y-auto">
          <SettingsPanel />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
