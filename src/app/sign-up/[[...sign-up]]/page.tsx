import { SignUp } from '@clerk/nextjs'
import { LogoMark } from '@/components/logo'

export default function Page() {
  return (
    <div className='flex h-screen flex-col items-center justify-center gap-8 bg-background px-4'>
      <div className='flex flex-col items-center gap-3'>
        <LogoMark className='size-16' glow />
        <div className='text-center'>
          <p className='text-xl font-bold tracking-tight'>
            Cere<span className='text-violet-500'>post</span>
          </p>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            Your AI-native inbox
          </p>
        </div>
      </div>
      <SignUp />
    </div>
  )
}
