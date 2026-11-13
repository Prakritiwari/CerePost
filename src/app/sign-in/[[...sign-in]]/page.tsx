import { SignIn } from '@clerk/nextjs'
import { BrandLogo } from '@/components/brand-logo'

export default function Page() {
  return (
    <div className='flex h-screen flex-col items-center justify-center gap-8 bg-background px-4'>
      <div className='flex flex-col items-center gap-3'>
        <BrandLogo className='h-20' glow priority />
        <div className='text-center'>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            Your AI-native inbox
          </p>
        </div>
      </div>
      <SignIn />
    </div>
  )
}
