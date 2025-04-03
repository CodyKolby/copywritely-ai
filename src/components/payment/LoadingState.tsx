
interface LoadingStateProps {
  isWaitingForAuth: boolean;
}

export const LoadingState = ({ isWaitingForAuth }: LoadingStateProps) => (
  <div className="flex flex-col items-center">
    <div className="w-16 h-16 border-4 border-t-copywrite-teal border-opacity-50 rounded-full animate-spin mb-4"></div>
    <p className="text-lg text-gray-600">
      {isWaitingForAuth ? 'Weryfikujemy Twoją sesję...' : 'Weryfikujemy Twoją płatność...'}
    </p>
    <p className="text-sm text-gray-500 mt-2">
      {isWaitingForAuth ? 'Może to potrwać kilka sekund...' : 'Trwa przetwarzanie płatności...'}
    </p>
  </div>
);
