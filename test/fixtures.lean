/- A nesting /- block comment -/ that must survive. -/
/-- Doc comment with `markdown`. -/
-- line comment
import Mathlib.Order.Basic
namespace Praxis

set_option autoImplicit false

structure Stock (praxis : ActionFrame) where
  size : Nat
  deriving Repr

/-- The real fence from www.cyberchitta.cc/articles/apodictic. -/
theorem urgency_principle {praxis : ActionFrame} [DecidableEq praxis.End]
    {agent : praxis.Agent} {time : praxis.Time}
    {stock : Stock praxis agent time}
    (plan : AllocationPlan stock) (dominance : SwapDominant plan)
    (independent : praxis.IndependentUses agent time)
    (fewer more : Finset praxis.Means) (step : stock.OneMore fewer more) :
    ∀ kept ∈ plan.wouldServe fewer, ∀ lost, lost ∈ plan.wouldServe more →
      lost ∉ plan.wouldServe fewer →
        praxis.PrefersEnd agent time kept lost := by
  intro kept hkept lost hlost hnot
  exact dominance.prefers hkept hlost hnot

@[simp] private def «a quoted name» : Nat := 0x1F
abbrev Flag : Prop := True
example : Bool := true
#eval s!"stock has {Stock.size} horses"
def broken : Nat := sorry

end Praxis
