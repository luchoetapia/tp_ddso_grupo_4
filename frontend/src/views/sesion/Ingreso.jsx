import Ingresar from "@/components/ingresar/ingresar";
import InvitacionRegistro from "@/components/ingresar/invitacionRegistro";

export default function Ingreso() {
    return (
        <div className="grid w-full items-stretch gap-[18px] py-6 md:grid-cols-2 md:py-10">
            <Ingresar />
            <InvitacionRegistro />
        </div>
    );
}
