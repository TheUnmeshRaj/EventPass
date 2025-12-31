import {createClient} from '../../../lib/supabase/clients';


export default function check(){
  const supabase = createClient();
  supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin
  }
})
  return(
    <h1>This is pretty gay!</h1>
  );
}