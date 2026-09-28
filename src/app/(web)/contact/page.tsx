import ContactPage from '@web/components/ContactPage'
import { getContactSettings } from '@/libs/contact'

export const metadata = {
  title: "Contact Us | Jagu's Designing",
  description:
    'Visit the Surat atelier, write for styling help, and read how Jagu’s Designing looks after quality, secure checkout and customer support.'
}

const Page = async () => <ContactPage settings={await getContactSettings()} />

export default Page
