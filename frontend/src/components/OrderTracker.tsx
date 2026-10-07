import type { Order } from '../api/types';
import { STATUS_LABEL, TRACK_STAGES, dateTime } from '../lib/format';

/** Customer-facing progress tracker built from the order's status history. */
export default function OrderTracker({ order }: { order: Order }) {
  if (order.status === 'CANCELLED') {
    return (
      <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
        This order was cancelled{order.rejectionReason ? `: ${order.rejectionReason}` : '.'}
        {order.paymentStatus === 'REFUND_PENDING' && ' Your refund is being processed.'}
      </div>
    );
  }
  const reached = new Map(order.history.map((h) => [h.status, h.at]));
  const currentIdx = TRACK_STAGES.indexOf(order.status);
  // Grocery orders skip the restaurant stages, so only show stages that the order actually uses.
  const stages = order.grocery ? TRACK_STAGES.filter((s) => !['RESTAURANT_ACCEPTED', 'PREPARING'].includes(s)) : TRACK_STAGES;

  return (
    <ol className="space-y-3" aria-label="Order progress">
      {stages.map((s) => {
        const done = TRACK_STAGES.indexOf(s) <= currentIdx;
        const active = s === order.status;
        return (
          <li key={s} className="flex items-start gap-3" aria-current={active ? 'step' : undefined}>
            <span
              className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${done ? 'border-brand bg-brand' : 'border-stone-300 bg-white'} ${active ? 'ring-4 ring-brand/20' : ''}`}
            />
            <div>
              <p className={`text-sm ${done ? 'font-semibold' : 'text-stone-400'}`}>{STATUS_LABEL[s]}</p>
              {reached.get(s) && <p className="text-xs text-stone-500">{dateTime(reached.get(s)!)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
