#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Models for various simulation forces.

'''
#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------sxxz z

# Bokeh imports
from ..core.has_props import abstract
from ..core.properties import (
    Auto,
    Bool,
    Either,
    Float,
    Instance,
    Int,
    List,
    Nullable,
    NumberSpec,
)
from ..core.property.dataspec import DataSpec, field
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ForceModel',
    'XYForce',
    'XForce',
    'YForce',
    'CollisionForce',
    'CenterForce',
    'RadialForce',
    'ManyBodyForce',
    'LinkForce',
    'Simulation',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@abstract
class ForceModel(Model):
    '''Base model for all forces.

    '''

    #TODO: Consider various preconfigured strength functions instead of constant
    #e.g. "DISTANCE_PROPORTIONAL, "DISTANCE_SQ_PROPORTIONAL"
    strength = Float(default=0.1, help="""
    Constant strength of force to be applied to all members.
    """)

@abstract
class XYForce(ForceModel):
    '''Base model for forces in the x/y directions

    '''

class XForce(XYForce):
    '''Apply force to all members from a specified x position.

    '''

    x = Float(help="""
    y-coordinate from which to apply the force.
    """)

class YForce(XYForce):
    '''Apply force to all members from a specified y position.

    '''

    y = Float(help="""
    y-coordinate from which to apply the force.
    """)

class CollisionForce(ForceModel):
    '''Apply force to members when their positions' radiuses overlap.

    '''

    radius = NumberSpec(default=field("radius"), help="""
    Data-space radius from which the collision force will act.
    """)

class CenterForce(XForce, YForce):
    '''Translation force to ensure center of mass (assuming equal member mass) is fixed.

    '''

class RadialForce(ForceModel):
    '''Force to apply to all members along a circle.

    '''
    x = Float(help="""
    x-coordinate of the center of the circle
    """)

    y = Float(help="""
    y-coordinate of the center of the circle
    """)

    radius = Float(help="""
    Distance from the center of the circle
    """)

class ManyBodyForce(ForceModel):
    '''Force enacted on a member from neighboring members.

    '''
    min_distance = Either(Float, Auto, default="auto", help="""
    Distance below which the force is no longer considered.
    """)

    max_distance = Either(Float, Auto, default="auto", help="""
    Distance above which the force is no longer considered.
    """)

class LinkForce(ForceModel):
    '''

    '''
    distance = Either(Float, Auto, default="auto", help="""
    Distance at which link force acts.
    """)

class ForceAPI(Model):
    '''Convenience syntax for quickly creating groups of forces.

    '''

    forces = List(Instance(ForceModel), help="""
    List of forces applied to simulation.
    """)

    def x(self, x: Float, strength: Float = 0.1):
        self.forces.append(XForce(x=x, strength=strength))
        return self

    def y(self, y: Float, strength: Float = 0.1):
        self.forces.append(YForce(y=y, strength=strength))
        return self

    def collision(self, radius: DataSpec, strength: Float = 0.1):
        self.forces.append(CollisionForce(radius=radius, strength=strength))
        return self

    def center(self, x: Float, y: Float, strength: Float = 0.1):
        self.forces.append(CenterForce(x=x, y=y, strength=strength))
        return self

    def radial(self, x: Float, y: Float, radius: Float, strength: Float = 0.1):
        self.forces.append(RadialForce(x=x, y=y, radius=radius, strength=strength))
        return self

    def manybody(self, min_distance= "auto", max_distance= "auto", strength: Float = 0.1):
        self.forces.append(ManyBodyForce(min_distance=min_distance, max_distance=max_distance, strength=strength))
        return self

    def link(self, distance= "auto", strength: Float = 0.1):
        self.forces.append(LinkForce(distance=distance, strength=strength))
        return self

class Simulation(ForceAPI):
    ''' Add a simulation to the renderer and apply forces

    '''

    alpha = Either(Float, Auto, default="auto", help="""
    Initial 'temperature' of simulation, which decause with each tick.
    """)

    alpha_min = Either(Float, Auto, default="auto", help="""
    Final 'temperature' of simulation, below which the simulation will stop.
    """)

    alpha_decay = Either(Float, Auto, default="auto", help="""
    Rate at which the simulation alpha decays.
    """)

    velocity_decay = Either(Float, Auto, default="auto", help="""
    Friction to apply to simulation.
    """)

    iterations = Either(Int, Auto, default="auto", help="""
    Set number of ticks to run the simulation.
    """)

    animated = Bool(default=True, help="""
    If true, simulation will use internal timer to tick.
    If false, will compute final layout and then render plot.
    """)

    # TODO: Consider Bool option to set self.fixed_x = self.x
    fixed_x = Nullable(NumberSpec, help="""
    x-coordinate at which to fix each member.
    """)

    fixed_y = Nullable(NumberSpec, help="""
    y-coordinate at which to fix each member.
    """)
#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
