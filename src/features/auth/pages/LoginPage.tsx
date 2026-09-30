import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { db } from '@/mocks/db'
import { homePath } from '@/lib/permissions'
import { ROLE_META } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { authService } from '@/services/auth.service'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/controls'
import { Avatar } from '@/components/ui/display'
import { Field, Input } from '@/components/ui/form'
import { PERSONAS } from '@/layouts/shell/DemoTools'

const schema = z.object({
  email: z.string().min(1, 'Saisissez votre courriel.').email('Courriel invalide.'),
  password: z.string().min(1, 'Saisissez votre mot de passe.'),
})
type Values = z.infer<typeof schema>

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const { register, handleSubmit, setValue, formState } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  const submit = async (values: Values) => {
    setError(null)
    try {
      const r = await authService.login(values.email, values.password)
      if (r.kind === '2fa') return navigate('/connexion/2fa', { state: location.state })
      if (r.kind === 'suspended') return navigate('/suspendu')
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/' ? from : homePath(r.user.role), { replace: true })
    } catch (e) {
      setError((e as Error).message)
      setShake(true)
      window.setTimeout(() => setShake(false), 400)
    }
  }

  const quickLogin = (email: string) => {
    setValue('email', email)
    setValue('password', 'demo1234')
    void handleSubmit(submit)()
  }

  return (
    <div className="animate-rise">
      <h1 className="text-[26px] font-bold text-ink">{t('auth.title')}</h1>
      <p className="mt-1 text-[14px] text-muted">{t('auth.subtitle')}</p>

      <form onSubmit={handleSubmit(submit)} className={cn('mt-8 flex flex-col gap-4', shake && 'animate-shake')} noValidate>
        {error && (
          <div role="alert" className="rounded-md border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-[13.5px] font-medium text-danger">
            {error}
          </div>
        )}
        <Field label={t('auth.email')} error={formState.errors.email?.message}>
          {(p) => <Input {...p} type="email" autoComplete="username" placeholder="prenom.nom@organisation.com" {...register('email')} />}
        </Field>
        <Field label={t('auth.password')} error={formState.errors.password?.message}>
          {(p) => (
            <div className="relative">
              <Input {...p} type={show ? 'text' : 'password'} autoComplete="current-password" className="pr-10" {...register('password')} />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
                aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          )}
        </Field>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[13.5px] text-ink-soft">
            <Checkbox defaultChecked /> {t('auth.remember')}
          </label>
          <Link to="/mot-de-passe-oublie" className="text-[13.5px] font-semibold text-brand-700 hover:underline">
            {t('auth.forgot')}
          </Link>
        </div>
        <Button type="submit" size="lg" loading={formState.isSubmitting} className="mt-1">
          {t('auth.submit')}
        </Button>
      </form>

      <p className="mt-5 text-center text-[13.5px] text-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/inscription" className="font-semibold text-brand-700 hover:underline">
          {t('auth.start')}
        </Link>
      </p>

      <section className="mt-10 border-t border-line pt-6" aria-labelledby="demo-title">
        <h2 id="demo-title" className="text-[13.5px] font-bold text-ink">
          {t('auth.demo')}
        </h2>
        <p className="mt-0.5 text-[12.5px] text-muted">{t('auth.demoHint')}</p>
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
          {PERSONAS.map((p) => {
            const u = db.users.find((x) => x.id === p.id)!
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => quickLogin(u.email)}
                  className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-brand-50/60"
                >
                  <Avatar name={`${u.firstName} ${u.lastName}`} size="sm" color={ROLE_META[u.role].color} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink">
                      {u.firstName} {u.lastName}
                      <span className="ml-2 text-[12px] font-semibold" style={{ color: ROLE_META[u.role].color }}>
                        {ROLE_META[u.role].short}
                      </span>
                    </span>
                    <span className="block truncate text-[12px] text-muted">{p.hint}</span>
                  </span>
                  <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </button>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 text-[12px] text-muted">
          Instance brandée :{' '}
          <Link to="/connexion?tenant=qualis" className="font-semibold text-brand-700 hover:underline">
            connexion via qualis.standset.com
          </Link>
          {' · '}Licencié suspendu : rodrigue.agbo@normeplus.bj
        </p>
      </section>
    </div>
  )
}
