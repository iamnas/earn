import { AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { TbBell, TbBellRinging } from 'react-icons/tb';
import { toast } from 'sonner';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { AuthWrapper } from '@/features/auth';
import { useUser } from '@/store/user';
import { cn } from '@/utils';

import { listingSubscriptionsQuery } from '../../queries/listing-notification-status';

interface Props {
  id: string;
  isTemplate?: boolean;
}

const toggleSubscription = async (id: string) => {
  await axios.post('/api/listings/notifications/toggle', { bountyId: id });
};

export const SubscribeListing = ({ id, isTemplate = false }: Props) => {
  const { user } = useUser();
  const posthog = usePostHog();
  const queryClient = useQueryClient();

  const { data: sub = [] } = useQuery(listingSubscriptionsQuery(id));

  const { mutate: toggleSubscribe, isPending: isSubscribeLoading } =
    useMutation({
      mutationFn: () => toggleSubscription(id),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: listingSubscriptionsQuery(id).queryKey,
        });
        toast.success(
          sub.find((e) => e.userId === user?.id)
            ? 'Unsubscribed'
            : 'Subscribed',
        );
      },
      onError: () => {
        toast.error('Error occurred while toggling subscription');
      },
    });

  const avatars = [
    { name: 'Abhishek', src: ASSET_URL + '/pfps/t1.webp' },
    { name: 'Pratik', src: ASSET_URL + '/pfps/md2.webp' },
    { name: 'Yash', src: ASSET_URL + '/pfps/fff1.webp' },
  ];

  const handleToggleSubscribe = () => {
    toggleSubscribe();
  };

  const isSubscribed = sub.find((e) => e.userId === user?.id);

  return (
    <div className="flex items-center gap-2">
      <p className="text-slate-500">{sub.length + 1}</p>
      <div className="flex -space-x-3">
        {avatars.slice(0, sub.length + 1).map((avatar, index) => (
          <Avatar
            key={index}
            className="h-6 w-6 border-2 border-white md:h-8 md:w-8"
          >
            <AvatarImage src={avatar.src} alt={avatar.name || ''} />
            <AvatarFallback>{avatar.name}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="flex items-start">
        <AuthWrapper
          showCompleteProfileModal
          completeProfileModalBodyText={
            'Please complete your profile before subscribing to a listing.'
          }
        >
          <Button
            className={cn(
              'ph-no-capture gap-2 border-slate-300 font-medium text-slate-500 hover:bg-brand-purple hover:text-white',
              'w-8 p-0 md:w-auto md:px-4',
            )}
            variant="outline"
            disabled={isTemplate}
            onClick={() => {
              posthog.capture(
                isSubscribed ? 'unnotify me_listing' : 'notify me_listing',
              );
              handleToggleSubscribe();
            }}
            aria-label="Notify"
          >
            {isSubscribeLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSubscribed ? (
              <TbBellRinging />
            ) : (
              <TbBell />
            )}
            <span className="hidden md:inline">
              {isSubscribeLoading
                ? 'Subscribing'
                : isSubscribed
                  ? 'Subscribed'
                  : 'Subscribe'}
            </span>
          </Button>
        </AuthWrapper>
      </div>
    </div>
  );
};
